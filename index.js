#!/usr/bin/env node
'use strict'
const got        = require('got');
const CONFIG     = require('./config.js');
const API_URL    = 'https://slack.com/api';
const LIMIT_FAIL = 1000;

let count_fail = 0;

let accessFiles = function (token, onlyOldFiles) {
	const thirtyDaysAgo = Math.floor(new Date().getTime() / 1000) - 30 * 86400;

	/**
	 * delete single file
	 */
	let deleteFile = function (file) {
		//return back this delete promise
		return got(`${API_URL}/files.delete`, { body: { token: token, file: file.id } })
			.then((res) => {
				let validRes;
				
				try{
					validRes = res.body && JSON.parse(res.body);
				}catch(err){
					validRes = false;
				}
				
				let okRes = validRes && validRes.ok == true;

				if(!okRes){
					//fail case, increase count
					count_fail++;
					console.log('Fail to delete, log res.body', res.body);
					return;
				}
				
				console.log(`${file.name} was deleted.`);
			})
			.catch(error => console.error('Error while deleting files.', error))
	}

	/**
	 * Multiple delete with recurisve recall
	 */
	let deleteFiles = function (files) {
		if(!files) {
			//reset count
			count_fail = 0;
			console.error('Error while getting files.')
			return
		}

		if (!files.length) {
			//reset count for next run
			count_fail = 0;
			console.info('There is no files to be deleted.')
			return
		}

		console.log(`Deleting ${files.length} files...`)
		
		let delete_promises = files.map(file => deleteFile(file));
		
		Promise.all(delete_promises).then(()=>{
			// console.log(count_fail);

			if(count_fail > LIMIT_FAIL){
				//reset count
				count_fail = 0;
				console.log('Stop recursive call, bcs fail over setup LIMIT');
				return;
			}

			//list file only list out 1000 files
			//recursive call until finish
			accessFiles(CONFIG.token, true);
		});
	}

	/**
	 * Call out list files
	 * run multilple deletes
	 */
	got(`${API_URL}/files.list`, {
		body:{
			token: token,
			ts_to: onlyOldFiles ? thirtyDaysAgo : 0,
			count: 1000
		},
		json: true
	})
	.then(response => deleteFiles(response.body.files))
	.catch(error => console.error('Error while getting files.', error));
}

// 1 days interval check
// error when interval > integer limit, 30 * 86400 * 1000 @@
const run = function(){
	accessFiles(CONFIG.token, true);
	setTimeout(function(){
		run();
	}, 864000 * 1000); //1 days
}

// First call
run();
